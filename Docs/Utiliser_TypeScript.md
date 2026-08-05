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
