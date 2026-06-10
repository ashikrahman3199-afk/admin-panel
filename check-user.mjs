import { CognitoIdentityProviderClient, AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "ap-south-1" });
const userPoolId = "ap-south-1_EH4Nm3kRS";

async function checkUser(email) {
    try {
        const command = new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: email
        });
        const response = await client.send(command);
        console.log("User details:", JSON.stringify(response, null, 2));
    } catch (e) {
        console.error("Error fetching user:", e.name, e.message);
    }
}

checkUser("ashikrahman3199@gmail.com");
