import { CognitoIdentityProviderClient, ListUsersCommand, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

const userPoolId = "us-east-1_MYLryFvR3"; // from amplify_outputs.json
const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

async function run() {
    try {
        const listCmd = new ListUsersCommand({ UserPoolId: userPoolId });
        const response = await client.send(listCmd);
        console.log("Users:", JSON.stringify(response.Users, null, 2));

        for (const user of response.Users || []) {
            console.log(`Adding ${user.Username} to Admin group...`);
            try {
                const addCmd = new AdminAddUserToGroupCommand({
                    UserPoolId: userPoolId,
                    Username: user.Username,
                    GroupName: "Admin"
                });
                await client.send(addCmd);
                console.log(`Successfully added ${user.Username} to Admin group.`);
            } catch (e) {
                console.error(`Failed to add ${user.Username} to Admin group:`, e.name);
            }
        }
    } catch (e) { console.error(e) }
}
run();
