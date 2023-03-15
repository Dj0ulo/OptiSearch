import numpy as np

print("hello")
x = 1

def f(x):
    if x == 2:
        print('caca')
    else:
        print(np.sqrt(x))

for i in range(0,10):
    f(i)

f(25)