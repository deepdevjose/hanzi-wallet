"""Reproducible 3-hidden-layer handwriting baseline. No human-data accuracy claim."""
from __future__ import annotations
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS','2')
os.environ.setdefault('OMP_NUM_THREADS','2')
import argparse
import json
import math
import time
from pathlib import Path
from typing import Any
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, top_k_accuracy_score

ROOT=Path(__file__).resolve().parents[1]
GRID=24

def normalize(strokes: list[np.ndarray])->list[np.ndarray]:
    flat=np.concatenate(strokes)
    lo=flat.min(axis=0); extent=flat.max(axis=0)-lo
    return [(s-lo-extent/2)/max(float(extent.max()),.001)*.78+.5 for s in strokes]

def resample(s:np.ndarray,n:int)->np.ndarray:
    if len(s)<2:return np.repeat(s[:1],n,axis=0)
    lengths=np.linalg.norm(np.diff(s,axis=0),axis=1)
    cs=np.r_[0,np.cumsum(lengths)]
    if cs[-1]<1e-7:return np.repeat(s[:1],n,axis=0)
    target=np.linspace(0,cs[-1],n)
    return np.column_stack([np.interp(target,cs,s[:,i])for i in (0,1)])

def features(strokes:list[np.ndarray])->np.ndarray:
    result=np.zeros(609,dtype=np.float32)
    norm=normalize(strokes)
    image=result[:576].reshape(24,24)
    for s in norm:
        length=float(np.linalg.norm(np.diff(s,axis=0),axis=1).sum())
        points=resample(s,max(2,math.ceil(length/.012)))
        for px,py in points*23:
            x0=max(0,math.floor(px)-2); x1=min(23,math.ceil(px)+2)
            y0=max(0,math.floor(py)-2); y1=min(23,math.ceil(py)+2)
            yy,xx=np.mgrid[y0:y1+1,x0:x1+1]
            patch=np.exp(-((xx-px)**2+(yy-py)**2)/.98)
            image[y0:y1+1,x0:x1+1]=np.maximum(image[y0:y1+1,x0:x1+1],patch)
    result[576+min(23,max(0,len(strokes)-1))]=1
    total=0.
    for s in norm:
        diff=np.diff(s,axis=0)
        for dx,dy in diff:
            distance=math.hypot(dx,dy)
            angle=math.floor((math.atan2(dy,dx)+math.pi)/(2*math.pi)*8)%8
            result[600+angle]+=distance;total+=distance
    if total:result[600:608]/=total
    flat=np.concatenate(strokes);extent=flat.max(axis=0)-flat.min(axis=0)
    result[608]=min(2,float(extent[0])/max(float(extent[1]),.001))/2
    return result

def augment(template:list[np.ndarray],rng:np.random.Generator,severity:float)->list[np.ndarray]:
    result=[]
    angle=rng.normal(0,.035*severity); cs=math.cos(angle);sn=math.sin(angle)
    transform=np.array([[cs*rng.uniform(.85,1.15),-sn],[sn,cs*rng.uniform(.85,1.15)]])
    for s in template:
        dense=resample(s,int(rng.integers(10,36)))
        offset=rng.normal(0,.012*severity,2)
        noise=rng.normal(0,.004*severity,dense.shape)
        # Smooth pen wobble, not independent pixel noise.
        noise[1:]=(noise[1:]+noise[:-1])/2
        result.append((dense-.5)@transform+.5+offset+noise)
    return result

def forward(model:dict[str,Any],x:np.ndarray)->np.ndarray:
    for layer in model['layers']:
        w=np.asarray(layer['weights'],np.float32).reshape(layer['input'],layer['output'])
        x=x@w+np.asarray(layer['biases'],np.float32)
        if layer['activation']=='relu':x=np.maximum(x,0)
        else:
            x=np.exp(x-x.max(axis=1,keepdims=True));x/=x.sum(axis=1,keepdims=True)
    return x

def main()->None:
    parser=argparse.ArgumentParser();parser.add_argument('--evaluate-only',action='store_true');args=parser.parse_args()
    data=json.loads((ROOT/'public/data/templates.json').read_text())
    classes=[d['char']for d in data]
    templates=[[np.array([[p['x'],p['y']]for p in s])for s in d['medians']]for d in data]
    start=time.time()
    if not args.evaluate_only:
        rng=np.random.default_rng(20261029);x=[];y=[]
        for i,template in enumerate(templates):
            x.append(features(template));y.append(i)
            for _ in range(55):x.append(features(augment(template,rng,1.4)));y.append(i)
            if i%25==0:print(f'Generating {i}/{len(classes)}',flush=True)
        train=np.asarray(x,np.float32);labels=np.asarray(y)
        print(f'Training on {len(labels)} synthetic samples, {train.shape[1]} features',flush=True)
        clf=MLPClassifier(hidden_layer_sizes=(192,96,64),activation='relu',solver='adam',batch_size=192,learning_rate_init=.0015,max_iter=110,early_stopping=True,validation_fraction=.12,n_iter_no_change=12,random_state=29,verbose=False)
        from threadpoolctl import threadpool_limits
        with threadpool_limits(limits=2):clf.fit(train,labels)
        print(f'Trained {clf.n_iter_} epochs; validation {clf.best_validation_score_:.4f}',flush=True)
        layers=[]
        for i,(w,b)in enumerate(zip(clf.coefs_,clf.intercepts_,strict=True)):
            layers.append(dict(input=int(w.shape[0]),output=int(w.shape[1]),weights=np.round(w.astype(np.float64),6).ravel().tolist(),biases=np.round(b.astype(np.float64),6).tolist(),activation='softmax'if i==len(clf.coefs_)-1 else'relu'))
        model=dict(version=1,grid=24,features=609,classes=classes,layers=layers)
        (ROOT/'public/model/ink-mlp.json').write_text(json.dumps(model,ensure_ascii=False,separators=(',',':')))
        # Shared fixtures verify JS preprocessing and exported inference numerically.
        fixtures=[]
        for i in [0,5,20,len(classes)-1]:
            raw=[[dict(x=float(p[0]),y=float(p[1]))for p in s]for s in templates[i]]
            f=features(templates[i]);fixtures.append(dict(char=classes[i],strokes=raw,features=f.tolist(),prediction=forward(model,f[None])[0].tolist()))
        (ROOT/'tests/model-fixtures.json').write_text(json.dumps(fixtures,ensure_ascii=False,separators=(',',':')))
    model=json.loads((ROOT/'public/model/ink-mlp.json').read_text())
    # Held-out augmentation seed; these are NOT human handwriting test examples.
    rng=np.random.default_rng(888);test=[];truth=[]
    for i,template in enumerate(templates):
        for _ in range(8):test.append(features(augment(template,rng,1.8)));truth.append(i)
    probabilities=forward(model,np.asarray(test,np.float32))
    metrics=dict(dataset='Held-out synthetic perturbations of the same canonical stroke templates; no independent human data.',classes=len(classes),training_samples=len(classes)*56,test_samples=len(truth),top1=round(float(accuracy_score(truth,probabilities.argmax(axis=1))),5),top5=round(float(top_k_accuracy_score(truth,probabilities,k=5,labels=np.arange(len(classes)))),5),seed_train=20261029,seed_test=888,seconds=round(time.time()-start,2),limitations=['No real handwriting dataset validation.','One canonical template per class; synthetic split shares underlying character source.','Softmax outputs and match scores are not calibrated probabilities.','Vocabulary is limited to the bundled 151 characters.'])
    (ROOT/'public/model/metrics.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(metrics,ensure_ascii=False,indent=2),flush=True)

if __name__=='__main__':main()
