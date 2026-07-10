export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const userStr = localStorage.getItem('insightAI_currentUser');
    let token = null;
    
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            token = user.access_token;
        } catch (e) {
            console.error('Failed to parse current user from local storage', e);
        }
    }

    const headers = new Headers(init?.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const newInit: RequestInit = {
        ...init,
        headers
    };

    return fetch(input, newInit);
}
