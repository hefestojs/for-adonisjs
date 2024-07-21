// import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  // protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: any, ctx: HttpContext) {
    switch (error.code) {
      case '23505':
        return ctx.response.status(409).json({
          severity: 'error',
          summary: 'Unique Constraint Violation!',
          detail: error.detail,
        })
      case 'ERR_BAD_REQUEST':
        return ctx.response.status(error.response.status).json({
          severity: 'error',
          summary: 'Bad Request!',
          detail: error.response?.data || error.message,
        })
      case 'E_INVALID_CREDENTIALS':
        return ctx.response.status(400).json({
          severity: 'error',
          summary: 'Failed to generate a token!',
          detail: 'Your token request attempt was not successful, check your credentials!',
        })
      case 'E_INVALID_AUTH':
        return ctx.response.status(401).json({
          severity: 'error',
          summary: 'Login Failed!',
          detail: 'Your login attempt was not successful, check your credentials!',
        })
      case 'E_UNAUTHORIZED_ACCESS':
        return ctx.response.status(401).json({
          severity: 'error',
          summary: 'Unauthorized access!',
          detail: 'You do not have the necessary token permission to access this resource.',
        })
      case 'E_ROUTE_NOT_FOUND':
        return ctx.response
          .status(404)
          .json({ severity: 'error', summary: 'Route Not Found!', detail: error.message })
      case 'E_ROW_NOT_FOUND':
        return ctx.response.status(404).json({
          severity: 'error',
          summary: 'Row Not Found!',
          detail: 'The requested row was not found!',
        })
      case 'E_VALIDATION_ERROR':
      case 'E_VALIDATION_FAILURE':
        return ctx.response
          .status(422)
          .json({ severity: 'error', summary: 'Field Validation Failed!', detail: error.messages })
      default:
        console.log(error)
        return ctx.response.status(error.status).json({
          severity: 'error',
          summary: error.code || 'Internal Server Error',
          detail: error.message,
          stack: this.debug ? error.stack : undefined,
        })
    }
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
