FROM python:3.10-slim
WORKDIR /app

# Copy code w/o secrets
COPY src/*.txt ./
COPY src/*.py ./
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000
CMD ["python", "app.py"]