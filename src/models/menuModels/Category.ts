export class Category {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  static fromOutputResult(output: any): Category {
    return new Category(output.id, output.name);
  }
}