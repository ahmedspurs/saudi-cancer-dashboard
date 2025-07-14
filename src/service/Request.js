import { api } from '@/service/axios';
import { loaderState } from '@/utils/Loader'; // Adjust path

const request = {
  handleError(error, defaultMessage, status) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.msg ||
      error?.message ||
      defaultMessage;

    console.error('HTTP Request Error:', {
      message,
      status: error?.response?.status,
      data: error?.response?.data,
      status
    });

    return Promise.reject(error);
  },

  handleSuccess(response) {


    if (response?.data?.status) {
      return { ...response.data, status_code: response.status };
    }
    return Promise.reject(response);
  },

  get: async (url, options = {}) => {
    loaderState.show();
    try {
      const response = await api.instance.get(url, {
        ...options,
        validateStatus: (status) => status < 500,
      });
      if (response.status == 401) {
        return request.handleError(response.data, response.data.msg, response.status)
      }
      return response.data;
    } catch (error) {
      return request.handleError(error, 'Failed to fetch data');
    } finally {
      loaderState.hide();
    }
  },

  post: async (url, payload, options = {}) => {
    const isSearch =
      /(^|\/)search($|\/|\?)/.test(url) ||
      url.includes('paginate') ||
      url.includes('conference/by-category') ||
      url.includes('conference/subscription-plan') ||
      url.includes('conference-categories');

    if (!isSearch) loaderState.show();

    try {
      const response = await api.instance.post(url, payload, {
        ...options,
        validateStatus: (status) => status < 500,
      });
      if (response.status == 401) {
        return request.handleError(response.data, response.data.msg, response.status)
      }
      return request.handleSuccess(response);
    } catch (error) {
      return request.handleError(error, 'Operation failed');
    } finally {
      if (!isSearch) loaderState.hide();
    }
  },

  put: async (url, id, payload, options = {}) => {
    loaderState.show();
    try {
      const response = await api.instance.put(`${url}/${id}`, payload, {
        ...options,
        validateStatus: (status) => status < 500,
      });
      if (response.status == 401) {
        return request.handleError(response.data, response.data.msg, response.status)
      }
      return request.handleSuccess(response);
    } catch (error) {
      return request.handleError(error, 'Error during update');
    } finally {
      loaderState.hide();
    }
  },

  delete: async (url, id, options = {}) => {
    loaderState.show();
    try {
      const response = await api.instance.delete(`${url}/${id}`, {
        ...options,
        validateStatus: (status) => status < 500,
      });
      if (response.status == 401) {
        return request.handleError(response.data, response.data.msg, response.status)
      }
      return request.handleSuccess(response);
    } catch (error) {
      return request.handleError(error, 'Failed to delete');
    } finally {
      loaderState.hide();
    }
  },
};

export default request;