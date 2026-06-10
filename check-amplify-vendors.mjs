import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import fs from 'fs';

const outputs = JSON.parse(fs.readFileSync('amplify_outputs.json', 'utf8'));
Amplify.configure(outputs);

const client = generateClient();

async function run() {
    try {
        console.log("Listing UserProfiles with role VENDOR...");
        const { data, errors } = await client.models.UserProfile.list({
            filter: { role: { eq: "VENDOR" } }
        });
        if (errors) {
            console.error("Errors:", errors);
        }
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Failed:", e);
    }
}

run();
