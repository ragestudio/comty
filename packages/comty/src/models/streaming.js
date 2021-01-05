export default {
    namespace: 'streaming',
    state: {
        onStreaming: false,
        isConnected: false,
    },
    effects: {
        *initStreaming({ payload }, { select, put }) {

        },

    },
    reducers: {
        updateState(state, { payload }) {
            return {
                ...state,
                ...payload,
            };
        }
    }
}
