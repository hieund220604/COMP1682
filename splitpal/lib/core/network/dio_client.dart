import 'package:dio/dio.dart';
import 'package:splitpay/core/constants/api_endpoints.dart';
import 'package:splitpay/core/storage/token_storage.dart';

class DioClient {
  final Dio _dio;
  final TokenStorage _tokenStorage;

  DioClient({TokenStorage? tokenStorage})
      : _tokenStorage = tokenStorage ?? TokenStorage(),
        _dio = Dio(
          BaseOptions(
            baseUrl: ApiEndpoints.baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {
              'Content-Type': 'application/json',
            },
            validateStatus: (status) {
              return status != null && status < 500;
            },
          ),
        ) {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));

    // Auth Token Interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Automatically add token to requests
          final token = await _tokenStorage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          // Handle 401 errors (unauthorized)
          if (error.response?.statusCode == 401) {
            await _tokenStorage.clearAll();
            // You might want to navigate to login here
          }
          return handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;
}
