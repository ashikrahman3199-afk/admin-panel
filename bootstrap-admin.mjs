import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import outputs from "./amplify_outputs.json" assert { type: "json" };

Amplify.configure(outputs);

// The type Schema is complex, but we can do a blind mutation via API
async function boostrapAdmin() {
    console.log("Setting up client...");
    // Because we are running via node without auth, this needs to bypass auth rules if possible,
    // or we need to use the AWS SDK for DynamoDB directly instead of Amplify Data.
}

boostrapAdmin();
