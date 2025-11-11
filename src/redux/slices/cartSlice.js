import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const cartSlice = createSlice({
    name : "cart",
    initialState,
    reducers : {
        addItems : (state, action) => {
            state.push(action.payload);
        },

        removeItem: (state, action) => {
            return state.filter(item => item.id != action.payload);
        },

        removeAllItems: (state) => {
            return [];
        },
        updateItemNote: (state, action) => {
            const { id, note } = action.payload || {};
            const idx = state.findIndex(it => it.id === id);
            if (idx !== -1) {
                state[idx] = { ...state[idx], note };
            }
        }
    }
})

export const getTotalPrice = (state) => state.cart.reduce((total, item) => total + item.price, 0);
export const { addItems, removeItem, removeAllItems, updateItemNote } = cartSlice.actions;
export default cartSlice.reducer;
