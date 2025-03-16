interface ReadEnvVariableOptions {
  required?: boolean;
  default?: string;
}

const defaultReadEnvOptions: ReadEnvVariableOptions = {
  required: false,
};

export const readEnvVariable = (
  key: string,
  options: ReadEnvVariableOptions = {},
): string => {
  const opts = Object.assign(defaultReadEnvOptions, options);
  const value = process.env[key] || '';

  if (opts.required && !value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  return value;
};
