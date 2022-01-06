# Cloud-Plot

This project can be used to plot chia in AWS using Fargate. This method is *not* advised.

⚠️The resources this project deploys do incur charges. 
It is not advised to plot or farm chia in the cloud as the costs are prohibitively expensive.
This project uses Fargate, EFS, and S3 to create and store plots. 
⚠️Do you own research before deploying this project.

⚠️This project is mostly untested. It is intended for educational purposes only.

⚠️⚠️**Use at your own risk and expense.**⚠️⚠️

⚠️Once deployed, this will continue to plot until destroyed.

## To get started you will need:

- an AWS account
- the AWS CLI tool
- docker
- node and npm
- aws cdk

## To plot with your farm and pool public keys, set them in the cdk.json file

## To deploy:

- git clone the repo
- cd into the project folder
- edit the cdk.json file and enter your own farm and pool public keys. Set parallelFactor to the number of tasks you want to run in fargate at the same time.
- `aws configure`  (enter your aws iam user keys and region)
- `npm install`
- `cdk bootstrap aws://<AWS_ACCOUNT_ID>/<AWS_REGION>`  (example: aws://123456789876/us-east-1)
- `cdk deploy`

# To adjust CPU, Memory
open the file lib/cloud-plot-stack.ts
find the FargateTaskDefinition and edit cpu and memoryLimitMiB

# To adjust plot settings
open file modules/plotter/entrypoint.sh
find the line that includes `chia plots create...`

# To remove all deployed resources:
 - `cdk destroy`
 - note that cdk bootstrap leaves some resources deployed. You can remove these by deleting the CloudFormation Stack named CDKToolkit.
 - note that the S3 bucket will be destroyed including any plots stored there.
