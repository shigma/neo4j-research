rm ./output_20180724 -r
neo4j-import --id-type string ^
    --into output_20180724/neo4j.db ^
    --nodes output_20180724/phone.csv ^
    --nodes output_20180724/people.csv ^
    --relationships output_20180724/people-phone.csv ^
    --relationships output_20180724/phone-phone.csv
