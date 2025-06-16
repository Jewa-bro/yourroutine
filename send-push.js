// This script sends push notifications to all subscribed users.
//
// To run this script, you need to have a .env file in the root of the project with the following variables:
// VITE_SUPABASE_URL=your_supabase_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
// VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
// VAPID_PRIVATE_KEY=your_vapid_private_key
//
// You can generate VAPID keys using the web-push library:
// npx web-push generate-vapid-keys

require('dotenv').config();
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !vapidPublicKey || !vapidPrivateKey) {
    console.error('Please make sure to define all required environment variables in your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

webpush.setVapidDetails(
    'mailto:your-email@example.com', // Replace with your email
    vapidPublicKey,
    vapidPrivateKey
);

async function sendPushNotifications() {
    console.log('Fetching push subscriptions...');
    const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('subscription_data, user_id');

    if (error) {
        console.error('Error fetching subscriptions:', error);
        return;
    }

    if (!subscriptions || subscriptions.length === 0) {
        console.log('No push subscriptions found.');
        return;
    }

    console.log(`Found ${subscriptions.length} subscriptions. Sending notifications...`);

    const notificationData = {
        title: 'YourRoutine Update',
        body: 'A new routine has been added!',
        url: '/routines'
    };
    const notificationPayload = JSON.stringify(notificationData);

    const notificationsToInsert = subscriptions.map(sub => ({
        user_id: sub.user_id,
        title: notificationData.title,
        body: notificationData.body,
        url: notificationData.url
    }));

    const { error: insertError } = await supabase.from('notifications').insert(notificationsToInsert);
    if (insertError) {
        console.error('Error inserting notifications:', insertError);
    } else {
        console.log('Successfully inserted notifications into DB.');
    }

    const sendPromises = subscriptions.map(sub => {
        return webpush.sendNotification(sub.subscription_data, notificationPayload)
            .then(response => console.log(`Successfully sent notification to user ${sub.user_id}:`, response.statusCode))
            .catch(error => {
                console.error(`Error sending notification to user ${sub.user_id}:`, error);
                if (error.statusCode === 410) {
                    console.log('Subscription expired or invalid. Deleting from DB.');
                    return supabase.from('push_subscriptions').delete().eq('subscription_data', sub.subscription_data);
                }
            });
    });

    await Promise.all(sendPromises);
    console.log('Finished sending notifications.');
}

sendPushNotifications(); 