import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';


import { getRepository, getCustomRepository } from 'typeorm';

interface Request {
  title: string,
  value: number,
  type: 'income' | 'outcome',
  category: string
}

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

class CreateTransactionService {
  public async execute({ title, value, type, category }: Request): Promise<Transaction> {

    const transactionRepository = getRepository(Transaction);
    const categoryRepository = getRepository(Category);

    const Alltransactions = await transactionRepository.find();

    const { income, outcome } = Alltransactions.reduce(
      (accumulator: Balance, transactions: Transaction) => {
      switch (transactions.type) {
        case "income":
          accumulator.income += Number(transactions.value);
        break;
        case "outcome":
          accumulator.outcome += Number(transactions.value);
        break;
        default:
          break;
      }

      return accumulator;
    }, {
      income: 0,
      outcome: 0,
      total: 0
    })

    const total = income - outcome;

    if( value > total && type === 'outcome'){
      throw new AppError('Você não possui saldo suficiente', 400);
    }


    // let transactionCategory = await categoryRepository.findOne({
    //   where: {
    //     title: category
    //   }
    // })

    let checkCategoryExists = await categoryRepository.findOne({
      where: { title: category }
    });

    if(!checkCategoryExists){
      /* se não existir essa categoria ele cria */
      checkCategoryExists = categoryRepository.create({
        title: category
      })

      await categoryRepository.save(checkCategoryExists);
    }

    // const CategoryExist = await categoryRepository.findOne({
    //   where: { title: category }
    // })

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: checkCategoryExists
    })

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
