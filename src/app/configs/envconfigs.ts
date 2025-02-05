export const envconfig = () => ({
  rabbitmqurl: process.env.RMQ_URL,
  socketurl: process.env.SOCKET_URL,
  sockettoken: process.env.SOCKET_TOKEN,
  firebase_vapid: process.env.FIREBASE_VAPID,
  company: process.env.COMPANY_NAME || 'RTECH',
  firebase_web: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  },
  firebaseServiceAccount: {
    type: process.env.FIREBASE_SERVICE_TYPE,
    project_id: process.env.FIREBASE_SERVICE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_SERVICE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_SERVICE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_SERVICE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_SERVICE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_SERVICE_AUTH_URI,
    token_uri: process.env.FIREBASE_SERVICE_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.FIREBASE_SERVICE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_SERVICE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_SERVICE_UNIVERSE_DOMAIN,
  },

  mail: {
    host: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    port: parseInt(process.env.EMAIL_PORT),
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    number: process.env.TWILIO_PHONE_NUMBER,
  },
  pahappa: {
    password: process.env.PAHAPPA_PASSWORD,
    username: process.env.PAHAPPA_USER_NAME,
    senderid: process.env.PAHAPPA_SENDER_ID,
  },
  encryption_file: {
    key: process.env.ENCRYPTION_KEY,
    algorithm: 'aes-256-cbc',
    ivLength: 16,
  },

  cloudinary: {
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
    mainfolder: process.env.CLOUD_MAIN_FOLDER,
  },
});

// create the type from the config
export type EnvConfig = ReturnType<typeof envconfig>;
export type firebase_web_config = EnvConfig['firebase_web'];
export type firebase_account = EnvConfig['firebaseServiceAccount'];
export type mailconfig = EnvConfig['mail'];
export type twilioconfig = EnvConfig['twilio'];
export type pahappaconfig = EnvConfig['pahappa'];
export type encryption = EnvConfig['encryption_file'];
export type cloudinary = EnvConfig['cloudinary'];
