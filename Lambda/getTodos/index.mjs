import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Accept both userId and userID
    const userId =
      event.queryStringParameters?.userId ||
      event.queryStringParameters?.userID;

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing userId in query parameters"
        })
      };
    }

    const params = {
      TableName: "todos",
      KeyConditionExpression: "userID = :uid",
      ExpressionAttributeValues: {
        ":uid": userId
      }
    };

    const result = await ddb.send(new QueryCommand(params));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.Items)
    };

  } catch (error) {
    console.error("GET Lambda error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" })
    };
  }
};