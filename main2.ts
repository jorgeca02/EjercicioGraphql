import { MongoClient, Database } from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";
import "https://deno.land/x/dotenv/load.ts";
import { ObjectId } from "https://deno.land/x/mongo@v0.31.1/mod.ts";

import { ApolloServer } from "npm:@apollo/server@^4.1";
import { startStandaloneServer } from "npm:@apollo/server@^4.1/standalone";
import { graphql } from "npm:graphql@^16.6";
import { gql } from 'https://deno.land/x/graphql_tag@0.0.1/mod.ts'
import { argsToArgsConfig } from "https://deno.land/x/graphql_deno@v15.0.0/lib/type/definition.d.ts";

//MONGO

type MongoHumanSchema = Omit<Human, "id"> & {
    _id: ObjectId;
  };
  type MongoRecipeSchema = Omit<Recipe, "id"> & {
    _id: ObjectId;
  };
const dbName = "graphql"
const connectMongoDB = async (): Promise<Database> => {
    
    const usr = "jorgeca2002"
    const pwd = "1357924680"
    const cluster = "cluster0.aedynyz.mongodb.net"
    const mongo_url = `mongodb+srv://${usr}:${pwd}@${cluster}/${dbName}?authMechanism=SCRAM-SHA-1`;
    console.log("conectando...");
    const client = new MongoClient();
    await client.connect(mongo_url);
    console.log("conectado");
    const db = client.database(dbName);
    return db;
};

const db = await connectMongoDB();
console.info(`MongoDB ${dbName} connected`);

const HumansCollection = db.collection<MongoHumanSchema>("Humans");
const RecipesCollection = db.collection<MongoRecipeSchema>("Recipes");

//GRAPHQL

const typeDefs =gql`
type Recipe{
    name:String!
    id: String!
    author: Human!
}

type Human{
    name:String!
    id:String!
    recipes:[Recipe!]!
}

type Query {
    getHuman(id: String!):Human
    getRecipe(id: String!): Recipe
}

type Mutation{
    addHuman(name: String!):Human!
    addRecipe(name:String!,author:String!):Recipe!
}
`;

type Recipe = {
    name: string;
    id: string;
    author: Human;
};

type Human = {
    id: string;
    name:string;
    recipes:Recipe[];
};

type RecipeSchema = Omit<Recipe,"author"> & { author: string}
type HumanSchema = Omit<Human,"recipes">;

const resolvers = {
    Human: {
        recipes: async (parent: RecipeSchema): Promise<MongoRecipeSchema[]|undefined> => {
            const recipes:any = await RecipesCollection.find({id:parent.id})
            if (recipes) {
                return recipes
                }
        },
    },
    Query: {
        getHuman: async (_:unknown, args: { id: string }): Promise<MongoHumanSchema|undefined> => {
            const human: MongoHumanSchema | undefined = await HumansCollection.findOne({id:args.id});
            return human;
        },
        getRecipe: async (_:unknown, args: { id: string }): Promise<MongoRecipeSchema|undefined> => {
            const recipe: MongoRecipeSchema | undefined = await RecipesCollection.findOne({id:args.id});
            return recipe;
        },
    },
    Mutation: {
        addHuman: (_:unknown, args: { name: string }):MongoHumanSchema => {
            const newHuman:MongoHumanSchema=({
                name: args.name,
                id: "1",
                recipes: []
            } as unknown as MongoHumanSchema);
            HumansCollection.insertOne(newHuman)
            return newHuman;
        },
        addRecipe: (_:unknown, args: { name: string, author:string }):MongoRecipeSchema => {
            const newRecipe:MongoRecipeSchema=({
                name: args.name,
                id: "1",
                author: args.author
            } as unknown as MongoRecipeSchema);
            RecipesCollection.insertOne(newRecipe)
            return newRecipe;
        },
    },
};
const server = new ApolloServer({
    typeDefs,
    resolvers,
});

const{ url } = await startStandaloneServer(server, {
    listen: { port: 8000},
});

console.log(`Server runnng on: ${url}`)