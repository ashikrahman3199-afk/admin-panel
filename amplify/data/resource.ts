import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
    UserProfile: a.model({
        userId: a.string().required(),
        phoneNumber: a.string(),
        name: a.string(),
        email: a.string(),
        role: a.string(),
        avatar: a.string(),
        totalEarnings: a.float(),
        totalBookings: a.integer(),
        profileViews: a.integer(),
        status: a.string(), // Keeping this for Admin Panel status tracking if needed
    }).authorization(allow => [
        allow.authenticated().to(['read', 'update', 'delete']),
        allow.owner(),
    ]),

    AdSpace: a.model({
        title: a.string().required(),
        category: a.string().required(),
        location: a.string().required(),
        price: a.float().required(),
        priceUnit: a.string().required(),
        rating: a.float(),
        image: a.string(),
        description: a.string(),
        reach: a.string(),
        minSpend: a.float(),
        features: a.string().array(),
        approvalStatus: a.string(), // 'PENDING', 'APPROVED', 'REJECTED'
        rejectionReason: a.string(),
    }).authorization(allow => [allow.authenticated()]),

    Campaign: a.model({
        userId: a.string().required(),
        name: a.string().required(),
        objective: a.string(),
        designStyle: a.string(),
        selectedServices: a.string().array(),
        budget: a.float(),
        startDate: a.string(),
        endDate: a.string(),
        status: a.string(),
    }).authorization(allow => [
        allow.authenticated().to(['read', 'update']),
        allow.owner(),
    ]),

    Booking: a.model({
        userId: a.string().required(),
        campaignName: a.string(),
        orderDate: a.string(),
        startDate: a.string(),
        endDate: a.string(),
        status: a.string(),
        amount: a.float(),
        services: a.string().array(),
        itemsJson: a.string(),
        vendorProgressJson: a.string(),
        verificationImages: a.string().array(),
        paymentId: a.string(),
        razorpayOrderId: a.string(),
        razorpaySignature: a.string(),
        paymentStatus: a.string(), // 'PENDING', 'PAID', 'FAILED'
        commissionAmount: a.float(),
        vendorAmount: a.float(),
    }).authorization(allow => [
        allow.authenticated().to(['read', 'update']),
        allow.owner(),
    ]),

    Notification: a.model({
        userId: a.string().required(),
        title: a.string().required(),
        message: a.string().required(),
        type: a.string(),
        read: a.boolean(),
    }).authorization(allow => [
        allow.authenticated().to(['read', 'update']),
        allow.owner(),
    ]),

    VendorWallet: a.model({
        userId: a.string().required(), // The Vendor's User ID
        availableBalance: a.float().required(),
        totalEarnings: a.float().required(),
        totalWithdrawn: a.float().required(),
    }).authorization(allow => [
        allow.authenticated().to(['read', 'update']),
        allow.owner(),
    ]),

    WithdrawalRequest: a.model({
        userId: a.string().required(), // The Vendor's User ID
        amount: a.float().required(),
        requestDate: a.string().required(),
        paymentMethod: a.string(), // Bank Account, UPI ID, etc.
        paymentDetails: a.string(),
        status: a.string(), // 'PENDING', 'APPROVED', 'PROCESSED', 'REJECTED'
        processedDate: a.string(),
        adminNotes: a.string(),
    }).authorization(allow => [
        allow.authenticated().to(['read', 'update']),
        allow.owner(),
    ]),

    // Keep compatibility for any old code that might expect these models
    Transaction: a.model({
        amount: a.float().required(),
        status: a.string(),
        date: a.string(),
        vendorId: a.id(),
        customerId: a.id(),
    }).authorization(allow => [allow.authenticated()]),

    Vendor: a.model({
        businessName: a.string().required(),
        contact: a.string().required(),
        location: a.string(),
        status: a.string(),
    }).authorization(allow => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
    },
});
