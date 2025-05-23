interface Config {
  openai: {
    apiKey: string;
  };
  server: {
    port: number;
  };
  database: {
    url: string;
  };
}

export const config: Config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
}; 