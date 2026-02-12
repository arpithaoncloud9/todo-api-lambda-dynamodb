import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

  

const client = new DynamoDBClient({});

const ddb = DynamoDBDocumentClient.from(client);

  

export const handler = async (event) => {

try {

console.log("Received event:", JSON.stringify(event, null, 2));

  

const taskID = event.pathParameters?.taskID;

const userId =

event.queryStringParameters?.userId ||

event.queryStringParameters?.userID;

  

if (!taskID || !userId) {

return {

statusCode: 400,

body: JSON.stringify({

message: "Missing taskID or userId"

})

};

}

  

const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

  

const updateExpressions = [];

const expressionValues = {};

const expressionNames = {};

  

for (const key of ["title", "description", "status"]) {

if (body[key] !== undefined) {

updateExpressions.push(`#${key} = :${key}`);

expressionValues[`:${key}`] = body[key];

expressionNames[`#${key}`] = key;

}

}

  

if (updateExpressions.length === 0) {

return {

statusCode: 400,

body: JSON.stringify({

message: "No valid fields to update"

})

};

}

  

const params = {

TableName: "todos",

Key: {

userID: userId,

taskID: taskID

},

UpdateExpression: `SET ${updateExpressions.join(", ")}`,

ExpressionAttributeValues: expressionValues,

ExpressionAttributeNames: expressionNames,

ReturnValues: "ALL_NEW"

};

  

const result = await ddb.send(new UpdateCommand(params));

  

return {

statusCode: 200,

headers: { "Content-Type": "application/json" },

body: JSON.stringify(result.Attributes)

};

  

} catch (error) {

console.error("PUT Lambda error:", error);

return {

statusCode: 500,

body: JSON.stringify({ message: "Internal server error" })

};

}

};