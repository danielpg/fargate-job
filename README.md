
## Container Workflow

### Create an ECR repository

```
aws ecr create-repository  --repository-name fargate-job --region us-east-1
```

### Authenticate Docker to ECR

```
aws ecr get-login-password --region us-east-1 | docker login --username AWS \
    --password-stdin 701491313159.dkr.ecr.us-east-1.amazonaws.com
```
### Build Image
```
docker build -t fargate-job .
```

### Tag the image
```
docker tag fargate-job:latest 701491313159.dkr.ecr.us-east-1.amazonaws.com/fargate-job:latest
```

### Push the image
```
docker push 701491313159.dkr.ecr.us-east-1.amazonaws.com/fargate-job:latest
```

## Fargate Staging

### Create Execution role

```
aws iam create-role --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://fargate/fargate-trust.json
aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam put-role-policy   --role-name ecsTaskExecutionRole \
  --policy-name FargateExecutionAccess --policy-document file://fargate/execution-policy.json
```

###  Create Task role
```
aws iam create-role  --role-name fargateJobTaskRole \
  --assume-role-policy-document file://fargate/fargate-trust.json
aws iam put-role-policy --role-name fargateJobTaskRole \
  --policy-name FargateJobAccess \
  --policy-document file://fargate/task-policy.json
```
###  Create CloudWatch log group (logs:PutRetentionPolicy,logs:CreateLogGroup,logs:DescribeLogGroups)
```
aws logs create-log-group --log-group-name /ecs/fargate-job-alpha --region us-east-1
aws logs put-retention-policy --log-group-name /ecs/fargate-job-alpha --retention-in-days 30 --region us-east-1
```

## Fargate Workflow

### Create cluster (IF CMDLINE)
```
aws ecs create-cluster --cluster-name fargate-panda-z16 --region us-east-1
```
 
### Register the task definition
```
aws ecs register-task-definition --cli-input-json file://fargate/task-def.json --region us-east-1
```

## Schedule

### Event Bridge Role

```
aws iam create-role --role-name eventRunTaskRole --assume-role-policy-document file://fargate/eventbridge-ecs-trust.json
aws iam put-role-policy --role-name eventRunTaskRole --policy-name eventbridge-run-task \
  --policy-document file://fargate/eventbridge-run-task-policy.json
```

### Scheduler
```
aws scheduler create-schedule --name fargate-panda-daily \
  --schedule-expression "cron(0 2 * * ? *)" \
  --flexible-time-window '{ "Mode": "OFF" }' \
  --target '{
    "Arn": "arn:aws:ecs:us-east-1:701491313159:cluster/fargate-panda-z16",
    "RoleArn": "arn:aws:iam::701491313159:role/eventRunTaskRole",
    "EcsParameters": {
      "TaskDefinitionArn": "arn:aws:ecs:us-east-1:701491313159:task-definition/fargate-job-alpha",
      "TaskCount": 1,
      "LaunchType": "FARGATE",
      "NetworkConfiguration": {
        "AwsvpcConfiguration": {
          "Subnets": ["subnet-XXXXXX"],
          "SecurityGroups": ["sg-XXXXXX"],
          "AssignPublicIp": "ENABLED"
        }
      }
    }
  }'
  ```