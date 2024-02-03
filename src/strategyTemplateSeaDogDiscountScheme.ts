import { Client } from '@umerx/umerx-blackdog-configurator-client-typescript';
import { AlpacaClient, AlpacaStream } from '@umerx/alpaca';

const alpacaClientCredentialsKey =
    process.env.ALPACA_CLIENT_CREDENTIALS_KEY ?? '';
const alpacaClientCredentialsSecret =
    process.env.ALPACA_CLIENT_CREDENTIALS_SECRET ?? '';

const alpacaClient = new AlpacaClient({
    credentials: {
        key: alpacaClientCredentialsKey,
        secret: alpacaClientCredentialsSecret,
    },
    rate_limit: true,
});

const account = await alpacaClient.getAccount();
