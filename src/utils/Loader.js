import { reactive } from 'vue';

export const loaderState = reactive({
  isLoading: false,
  show() {
    this.isLoading = true;
  },
  hide() {
    this.isLoading = false;
  },
});