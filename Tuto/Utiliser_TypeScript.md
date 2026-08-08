Declarer une variable dans TypeScript :

let x = 10;

Afficher des caracteres dans le terminal :

console.log(x);
console.log("Hello World!");
console.log("Hello World, I have ", x, " cats.");
console.log(typeof x); -> afficher le type d'une variable

Les differents types de variables en TypeScript :

- Number : pour entiers et decimaux, positifs et negatifs (64bits floating point values)

- String
- Boolean

- Void : utilise quand il n'y a plus de data. Utilise pour les return de fonctions qui ne retournent rien.

ex:
function printHello(): void {
    console.log('Hello');
}

- Undefined : utilise pour les variables qui sont declares mais sans valeurs attribuees.

ex:
let newPlanet: undefined;
console.log(newPlanet);

Definir un type pour la variable :

let myVariable : string = "Hello";

Il est possible de changer la variable apres :

myVariable = "Salut les moches";

sauf si c'est un const :

const PI: number = 3.14;

Les operateurs dans TypeScript :

let number5: number = 5;
let number10: number = 10;

console.log(number5 == number10); // false, because 5 is not equal to 10
console.log(number5 === number10); // false, because 5 is not equal to 10
-> verifie si les valeurs ET les types sont identiques

console.log(number5 != number10); // true, because 5 is indeed not equal to 10
console.log(number5 !== number10); // true, because 5 is indeed not equal to 10
console.log(number5 > number10); // false, because 5 is not greater than 10
console.log(number5 < number10); // true, because 5 is less than 10
console.log(number5 >= number10); // false, because 5 is neither greater than nor equal to 10
console.log(number5 <= number10); // true, because 5 is less than or equal to 10

operations logiques :

// Let's understand their usage:

console.log(true && true);      // 'true' AND 'true' = true 
console.log(true && false);     // 'true' AND 'false' = false
console.log(true || false);     // 'true' OR 'false' = true
console.log(false || false);    // 'false' OR 'false' = false
console.log(!true);             // NOT 'true' = false
console.log(!false);            // NOT 'false' = true

ternaire :

? --> if : --> else

ex:
let isSnowing: boolean = false;

const message: string = isSnowing ? "Better wear warm clothes." : "No need for warm clothes.";

console.log(message); // Prints: "No need for warm clothes."

Il est possible de concatener string avec un number :

let score: number = 100;
// The '+' operator concatenates a string and a number
let message: string = "Your score is " + score;
console.log(message);  // Prints: "Your score is 100"

Il est possible d'utiliser la fonction concat():

let welcome: string = "Hello";
let firstName: string = "Alice";
// The .concat() function concatenates 'welcome', 'firstName', and a space between them
let greeting: string = welcome.concat(" ", firstName);
console.log(greeting);  // Prints: "Hello Alice"

Difference TUPLE & ARRAY :

Array : tableau sans taille definie. Je peux ajouter des elements sans me soucier de la taille
Tuple : tableau avec une taille fixe. En principe, je ne peux pas ajouter d'elements supplementaires.

La fonction .indexOf("element") : permet d'afficher l'index de l'element.
La fonction .length : permet de connaitre la taille de l'element.
La fonction .push("element") : ajoute l'element a la fin du tableau.
La fonction .pop() : enleve le dernier element du tableau.

Creer un tableau de tableau :

let multiArray: any[][] = [[1, 2, 3], ['a', 'b', 'c'], [true, false]];
console.log(multiArray); // Output: [ [ 1, 2, 3 ], [ 'a', 'b', 'c' ], [ true, false ] ]


let fruits: string[] = ['apple', 'banana', 'cherry'];

// Inserting an element 'avocado' at position 1 using .splice()
fruits.splice(1, 0, 'avocado');
console.log(fruits); // Output: [ 'apple', 'avocado', 'banana', 'cherry' ]

// Finding index of an element using .indexOf()
let index: number = fruits.indexOf('banana');
console.log(index); // Output: 2

// Reverse the fruits array
fruits.reverse();
console.log(fruits); // Output: [ 'cherry', 'banana', 'avocado', 'apple' ]

Les objets :

Dans ce cas, l'objet a necessairement deux variables:
let user: { name: string; age: number; } = {
  name: "Alice",
  age: 30,
};

encore un autre exemple :

interface Car {
  color: string;
  model: string;
  manufacturer: string;
}

let car: Car = {
  color: "red",
  model: "sedan",
  manufacturer: "Toyota",
};
console.log(car); // Outputs: {color: "red", model: "sedan", manufacturer: "Toyota"}

Une fois l'objet declare, il n'est pas possible d'ajouter plus tard des elements. Cela lancera une erreur.

Le ? permet de "denoter" une propriete de l'objet : cette propriete ne sera plus necessaire a la creation de l'objet.

interface Car {
  color: string;
  model: string;
  manufacturer: string;
  propellant?: string;
}

Pour creer une nouvelle fonction, il faut utiliser le mot "function"

function welcomeUser(name: string) {
  console.log(`Hello, ${name}!`);
}

Il y a aussi des fonctions "anonymes" sans nom mais declare comme une variable :

let welcomeUser = function(name: string) {
  console.log(`Hello, ${name}!`);
};

welcomeUser('Jane'); // Prints: "Hello, Jane!"

Il est possible de preciser des parametres optionnels :

function shipmentDetails(baseID: number, isInsured?: boolean, insuranceAmount: number = 0): void {
  console.log('Base ID:', baseID);
  console.log('Is Insured:', isInsured ? 'Yes' : 'No');
  if(isInsured) {
    console.log('Insurance Amount:', insuranceAmount);
  }
}

shipmentDetails(101, true, 5000); // Base ID: 101, Is Insured: Yes, Insurance Amount: 5000
shipmentDetails(102); // Base ID: 102, Is Insured: No

Il est possible d'utiliser les symboles => pour faciliter la lecture du code :

let checkBaseID = function(baseID: number): void {
  if (baseID <= 0) {
    console.log("Invalid ID!");
  }
};

DEVIENT 

let checkBaseID = (baseID: number): void => {
  if (baseID <= 0) {
    console.log("Invalid ID!");
  }
};

Le type de parametre '...' permet de mettre un nombre indefini de parametres :

// Function utilizing a variable-length argument with rest parameter syntax
function prepareVirtualShip(...crewMembers: string[]) {
  // Loop through each crew member
  for (let member of crewMembers) {
    console.log(`${member} is ready for the journey!`);
  }
}

// Call the function with three arguments
prepareVirtualShip('Captain Picard', 'Data', 'Worf'); // Logs each crew member to the console.
/*
Prints:
Captain Picard is ready for the journey!
Data is ready for the journey!
Worf is ready for the journey!
*/

Creer des classes dans TypeScript :

class Fruit {
  printColor() {
    console.log('Red'); // Prints 'Red' to the console
  }

  printMessage(name: string) {
    console.log(`Do you want a fruit, ${name}?`); // Greets and asks the user if they want a fruit
  }
}

let apple = new Fruit();
apple.printColor(); // Outputs: Red
apple.printMessage('John'); // Outputs: Do you want a fruit, John?

Comem en C++, il y a des constructeurs avec TypeScript :

class Car {
  brand: string;
  model: string;
  color: string;

  constructor(brand: string, model: string, color: string) {
    this.brand = brand;  
    this.model = model;  
    this.color = color;  
    console.log(`Instantiated a Car instance with brand=${brand}, model=${model}, color=${color}`);
  }
}

Le TypeScript fonctionne egalement avec des heritages :

// Parent class
class Parent {
    name: string; // name property

    constructor(name: string) {
        this.name = name;
    }

    greet(): void {
        console.log(`Hello, my name is ${this.name}`); // greet method
    }
}

// 'Child' class extending 'Parent'
class Child extends Parent {
    age: number; // age property

    constructor(name: string, age: number) {
        super(name);
        this.age = age;
    }

    info(): void {
        console.log(`I am ${this.age} years old.`); // info method
    }
}

const child = new Child('Alice', 10);
child.greet(); // prints: Hello, my name is Alice
child.info(); // prints: I am 10 years old.




