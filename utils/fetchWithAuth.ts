import { API_BASE } from '../config/api';

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

    const response = await fetch(input, newInit);

    // If token expired, try to refresh it automatically
    if (
        response.status === 401 || 
        (response.status === 500 && (await response.clone().text()).includes('JWT expired'))
    ) {
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.refresh_token) {
                    const refreshRes = await fetch(`${API_BASE}/refresh-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: user.refresh_token })
                    });
                    
                    if (refreshRes.ok) {
                        const refreshData = await refreshRes.json();
                        // Update local storage with new tokens
                        user.access_token = refreshData.access_token;
                        if (refreshData.refresh_token) {
                            user.refresh_token = refreshData.refresh_token;
                        }
                        localStorage.setItem('insightAI_currentUser', JSON.stringify(user));
                        
                        // Retry the original request with the new token
                        headers.set('Authorization', `Bearer ${refreshData.access_token}`);
                        const retryInit = { ...init, headers };
                        return fetch(input, retryInit);
                    } else {
                        // Refresh failed, clear user
                        localStorage.removeItem('insightAI_currentUser');
                        window.location.href = '/login';
                    }
                }
            } catch (e) {
                console.error('Failed to refresh token', e);
            }
        }
    }

    return response;
}
