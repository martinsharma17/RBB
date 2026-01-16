export interface Branch {
    id: number;
    name: string;
    code: string;
    location: string;
}

export const branchService = {
    getAll: async (apiBase: string, token: string) => {
        const response = await fetch(`${apiBase}/api/Branch`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch branches');
        return await response.json() as Branch[];
    },

    getById: async (id: number, apiBase: string, token: string) => {
        const response = await fetch(`${apiBase}/api/Branch/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch branch');
        return await response.json() as Branch;
    },

    create: async (branch: Omit<Branch, 'id'>, apiBase: string, token: string) => {
        const response = await fetch(`${apiBase}/api/Branch`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(branch)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to create branch');
        }
        return await response.json() as Branch;
    },

    update: async (id: number, branch: Branch, apiBase: string, token: string) => {
        const response = await fetch(`${apiBase}/api/Branch/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(branch)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update branch');
        }
    },

    delete: async (id: number, apiBase: string, token: string) => {
        const response = await fetch(`${apiBase}/api/Branch/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to delete branch');
    }
};
