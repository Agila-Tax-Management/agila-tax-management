// src/instrumentation.ts
export async function register() {
  // Instrumentation hook for future use
  // Currently no runtime-specific initialization needed
}

export const onRequestError = async (err: Error, request: Request) => {
  // This is called for server-side errors
  // You can add custom error handling logic here
  console.error('Request error:', {
    url: request.url,
    method: request.method,
    error: err.message,
  });
};
