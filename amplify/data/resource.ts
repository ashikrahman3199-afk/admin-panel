import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. https://docs.amplify.aws/gen2/build-a-backend/data/custom-business-logic/
=========================================================================*/
const schema = a.schema({
    Vendor: a
        .model({
            businessName: a.string().required(),
            contact: a.string().required(),
            location: a.string(),
            status: a.enum(['PENDING', 'VERIFIED', 'REJECTED']),
            inventory: a.hasMany('Service', 'vendorId'),
            owner: a.string(),
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated(), // Allow any authenticated user (our Admin dashboard relies on UI checks)
            allow.authenticated("identityPool").to(['read']), // Allow users to read verified vendors? Maybe complicate later. Keep simple.
            allow.publicApiKey().to(['read']),
        ]),

    ServiceOption: a
        .model({
            name: a.string().required(),
            price: a.float().required(),
            duration: a.string(),
            status: a.string(),
            serviceId: a.id(),
            service: a.belongsTo('Service', 'serviceId'),
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated(),
            allow.publicApiKey().to(['read']),
        ]),

    Service: a
        .model({
            name: a.string().required(),
            type: a.string(),
            price: a.float().required(),
            description: a.string(),
            approvalStatus: a.enum(['pending', 'approved', 'rejected']),
            vendorId: a.id(),
            vendor: a.belongsTo('Vendor', 'vendorId'),
            options: a.hasMany('ServiceOption', 'serviceId'),
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated(),
            allow.publicApiKey().to(['read']), // Public read for users
        ]),

    UserProfile: a
        .model({
            email: a.string().required(),
            name: a.string(),
            role: a.enum(['SUPER_ADMIN', 'ADMIN', 'ADMIN_PENDING', 'VENDOR', 'USER']), // Matches Cognito group logic but stored in DB
            status: a.enum(['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL']),
            profileId: a.id(),
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated(),
        ]),

    Booking: a
        .model({
            date: a.string().required(),
            status: a.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
            totalAmount: a.float(),
            vendorId: a.id(),
            customerId: a.id(),
            serviceId: a.id(),
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated(),
            allow.group('Vendor'), // Vendors need to see their bookings
        ]),

    Campaign: a
        .model({
            title: a.string().required(),
            status: a.enum(['ACTIVE', 'PAUSED', 'ENDED']),
            impressions: a.integer(),
            clicks: a.integer(),
            budget: a.float(),
            vendorId: a.id(),
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated(),
            allow.group('Vendor'),
        ]),

    Transaction: a
        .model({
            amount: a.float().required(),
            status: a.enum(['SUCCESS', 'FAILED', 'PENDING']),
            date: a.string(),
            vendorId: a.id(), // Who got paid
            customerId: a.id(), // Who paid
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated(),
            allow.group('Vendor'),
        ]),

    Dispute: a
        .model({
            reason: a.string().required(),
            status: a.enum(['OPEN', 'RESOLVED', 'CLOSED']),
            transactionId: a.id(),
            raisedBy: a.id(),
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated(),
        ]),

    WithdrawalRequest: a
        .model({
            amount: a.float().required(),
            status: a.enum(['PENDING', 'APPROVED', 'REJECTED']),
            vendorId: a.id(),
            vendor: a.belongsTo('Vendor', 'vendorId'),
            bankDetails: a.string(),
            requestedAt: a.string(),
        })
        .authorization((allow) => [
            allow.owner(),
            allow.authenticated(),
            allow.group('Vendor'),
        ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
        apiKeyAuthorizationMode: {
            expiresInDays: 30,
        },
    },
});
