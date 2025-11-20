
import {
  derivative, evaluate,
} from 'mathjs'

let lives = 3;

type MathQuestion = {
  expression: string;
  solution: number;
}

function rand(lowerBound: number, upperBound: number) {
  return Math.floor(Math.random() * upperBound) + lowerBound;
}

function randDecimal(lowerBound: number, upperBound: number) {
  const value = Math.random() * (upperBound - lowerBound) + lowerBound;
  const decimalPlaces = rand(0, 5);
  return Number(value.toFixed(decimalPlaces));
}

const ops = ['+', '-', '*', '/', '^'];
const funcs = ['log', 'sqrt', 'sin', 'cos', 'tan'];

function randOp() {
  return ops[rand(0, ops.length)]
}

function randFunc() {
  return funcs[rand(0, funcs.length)]
}

// Question 1: Super easy addition
function generateQuestion1(): MathQuestion {
  const a = rand(1, 9);
  const b = rand(1, 9);

  let expression: string;
  let solution: number;

  expression = `x = ${a} + ${b}`;
  solution = a + b;

  return { expression, solution };
}

// Question 2: Easy addition or subtraction
function generateQuestion2(): MathQuestion {
  // Randomly choose addition or subtraction
  const isAddition = Math.random() < 0.5;

  const a = rand(1, 20);
  const b = rand(1, 20);

  let expression: string;
  let solution: number;

  if (isAddition) {
    expression = `x = ${a} + ${b}`;
    solution = a + b;
  } else {
    expression = `x = ${a} - ${b}`;
    solution = a - b;
  }
  return { expression, solution };
}

// Question 3: Easy multiplication
function generateQuestion3(): MathQuestion{
  const a = rand(2, 10);
  const b = rand(2, 10);

  let expression: string;
  let solution: number;

  expression = `x = ${a} * ${b}`;
  solution = a * b;

  return { expression, solution };
}

// Question 4: Logarithms, exponents, sqrts
function generateQuestion4(): MathQuestion{
  const type = Math.floor(Math.random() * 3);

  let expression: string;
  let solution: number;

  if (type === 0) {
    const base = Math.random() < 0.5 ? 2 : 10;
    const exp = rand(1, 3)
    const a = Math.pow(base, exp);
    expression = `x = log_${base}(${a})`;
    solution = exp;
  } else if (type === 1) {
    const a = rand(2, 6)
    const b = rand(2, 4)
    expression = `x = ${a}^${b}`;
    solution = Math.pow(a, b);
  } else {
    const b = rand(2, 11)
    const a = b * b;
    expression = `x = sqrt(${a})`;
    solution = b;
  }

  return { expression, solution };
}

// Question 5: Horrible derivative
function generateQuestion5(): MathQuestion{

  const a = randDecimal(2, 100);
  const b = randDecimal(2, 100);
  const c = randDecimal(2, 100);
  const d = randDecimal(2, 100);

  const e = rand(2, 100);

  let expr = `${a} * ${randFunc()}(x) ${randOp()} ${b} ${randOp()} x ${randOp()} ${randFunc()}(${c}) ${randOp()} ${d} ${randOp()} ${randFunc()}(x)`;

  const derivativeExpr = derivative(expr, 'x').toString();
  const solution = evaluate(derivativeExpr, { x: e });
  const expression = `If f(x) = ${expr}, what is f'(${e})?`;

  return { expression, solution: Math.round(solution * 1000) / 1000 };
}

export function generateQuestions(): MathQuestion[] {
  const q1 = generateQuestion1();
  const q2 = generateQuestion2();
  const q3 = generateQuestion3();
  const q4 = generateQuestion4();
  const q5 = generateQuestion5();

  // Additional question for case when we want the player to win
  const q6 = generateQuestion3();

  return [q1, q2, q3, q4, q5, q6]
}