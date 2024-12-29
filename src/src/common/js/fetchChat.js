const fetchChat = async (url, data) => {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        return res;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
export default fetchChat;