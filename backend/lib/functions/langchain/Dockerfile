FROM public.ecr.aws/lambda/python:3.10

COPY requirements.txt ${LAMBDA_TASK_ROOT}

RUN pip install -r requirements.txt

RUN mkdir app
COPY app ${LAMBDA_TASK_ROOT}/app

CMD ["app.lambda_function.lambda_handler"]