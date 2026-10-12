// examples.js — 5 tiny-py programs
window.Examples={
list:['guess','fizzbuzz','clicker','catch','bounce'],
code(n){
return{
guess:'secret = 4\nguess = int(input("Guess 1-9: "))\nif guess == secret:\n    print("You got it!")\nelse:\n    print("Nope, it was " + str(secret))',
fizzbuzz:'for i in range(1, 16):\n    if i % 15 == 0:\n        print("fizzbuzz")\n    elif i % 3 == 0:\n        print("fizz")\n    elif i % 5 == 0:\n        print("buzz")\n    else:\n        print(i)',
clicker:'from tiny import *\nscore(0)\nb = box("tomato", 90, 90)\n\ndef hit():\n    score()\n    b.x = 20\n\non_click(hit)',
catch:'from tiny import *\np = Entity(color="blue", x=60, y=100)\nc = Entity(color="gold", x=200, y=100)\n\ndef move():\n    p.x = p.x + 10\n\non_key("ArrowRight", move)',
bounce:'from tiny import *\nb = Entity(color="orange", x=20, y=20)\ndx = 2\n\ndef update():\n    b.x = b.x + dx'
}[n]||'';}
};
