
cd /chia-blockchain

. ./activate

DT=`date +%s`

mkdir /mount/efs/${DT}
mkdir /mount/efs/${DT}/temp
mkdir /mount/efs/${DT}/plots

chia init

chia plots create -k 32 -u 128 -r 2 -n 1 -b 5600 -f ${FARM_KEY} -p ${POOL_KEY} -t /mount/efs/${DT}/temp -2 /mount/efs/${DT}/plots -d /mount/efs/${DT}/plots

aws s3 mv /mount/efs/${DT}/plots/ s3://${S3_BUCKET}/ --recursive

rm -rf /mount/efs/${DT}/plots
