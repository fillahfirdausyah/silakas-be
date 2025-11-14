import { HttpException, HttpStatus } from '@nestjs/common';

export function handleServiceError(error: any): never {
    if (error instanceof HttpException) {
        throw new HttpException(
            {
                message: error.getResponse()['message'],
            },
            error.getStatus(),
        );
    } else {
        throw new HttpException(
            {
                message: 'Internal server error.',
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}
