FROM python:3.10-slim
WORKDIR /app

# Copy only requirements first for caching
COPY src/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the code
COPY src/*.py ./
COPY src/*.txt ./

EXPOSE 8000
CMD ["python", "app.py"]