import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  const tableName = process.env.TABLE_NAME;

  try {
    const userID = event.pathParameters?.userID;
    const taskID = event.pathParameters?.taskID;

    if (!userID || !taskID) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing 'userID' or 'taskID' in path parameters"
        }),
      };
    }

    const params = {
      TableName: tableName,
      Key: {
        userID: { S: userID },
        taskID: { S: taskID }
      },
      ReturnValues: "ALL_OLD"
    };

    const result = await client.send(new DeleteItemCommand(params));

    if (!result.Attributes) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: `Todo with userID '${userID}' and taskID '${taskID}' not found`
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Todo '${taskID}' deleted successfully for user '${userID}'`
      }),
    };

  } catch (error) {
    console.error("Error deleting todo:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error while deleting todo",
        error: error.message,
      }),
    };
  }
};