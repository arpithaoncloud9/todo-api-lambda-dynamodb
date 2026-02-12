import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import crypto from "crypto";

  

const client = new DynamoDBClient({});

const ddb = DynamoDBDocumentClient.from(client);

  

export const handler = async (event) => {

try {

// In your API Gateway setup, event.body is already an object

const body = JSON.parse(event.body);

  

if (!body) {

console.log("Body is missing");

return {

statusCode: 400,

body: JSON.stringify({ message: "Request body is missing" })

};

}

  

const userID = body.userID;

const title = body.title;

const description = body.description;

  

console.log("Parsed fields:", { userID, title, description });

  

if (!userID || !title) {

return {

statusCode: 400,

body: JSON.stringify({ message: "Missing required fields" })

};

}

  

const taskID = crypto.randomUUID();

  

const item = {

userID,

taskID,

title,

description,

status: "pending",

createdAt: new Date().toISOString(),

updatedAt: new Date().toISOString()

};

  

console.log("Item to insert:", JSON.stringify(item, null, 2));

  

await ddb.send(

new PutCommand({

TableName: "todos",

Item: item

})

);

  

console.log("Successfully inserted item");

  

return {

statusCode: 200,

body: JSON.stringify(item)

};

} catch (error) {

console.error("POST Lambda error:", error);

return {

statusCode: 500,

body: JSON.stringify({ message: "Internal server error" + error })

};

}

};