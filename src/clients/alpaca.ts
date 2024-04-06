import { AlpacaClient, DefaultCredentials } from '@umerx/alpaca';

export function getAlpacaClient(credentials: DefaultCredentials): AlpacaClient {
    return new AlpacaClient({
        credentials: {
            key: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                ? process.env.ALPACA_API_KEY ?? ''
                : credentials.key,
            secret: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                ? process.env.ALPACA_API_SECRET ?? ''
                : credentials.secret,
            paper: Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                ? Boolean(process.env.ALPACA_API_USE_TEST_CREDENTIALS)
                : credentials.paper,
        },
        rate_limit: true,
    });
}
