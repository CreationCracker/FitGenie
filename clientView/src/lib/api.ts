import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ApiError {
  message: string;
}

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else if (error.message) {
          throw new Error(error.message);
        } else {
          throw new Error('An unexpected error occurred');
        }
      }
    );
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>('/login', data);
    return response.data;
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await this.axiosInstance.post<AuthResponse>('/signup', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.axiosInstance.post('/logout');
  }

  async me(): Promise<{ user: AuthResponse['user'] }> {
    const response = await this.axiosInstance.get<{ user: AuthResponse['user'] }>('/me');
    return response.data;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);