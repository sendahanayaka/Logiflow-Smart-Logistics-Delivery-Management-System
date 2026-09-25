export const API_BASE_URL = '/api'; // Using relative proxy for backend or exact domain based on deployment

export const handleApiError = async (response: Response) => {
    if (!response.ok) {
        let message = 'An unexpected error occurred';
        try {
            const errData = await response.json();
            message = errData.message || message;
        } catch {
            // Ignore parsing error if raw text
            message = response.statusText;
        }
        throw new Error(message);
    }
};
