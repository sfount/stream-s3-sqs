# pay-stream-s3-sqs

Message provider lambda to feed Amazon SQS with any number of messages from a simple CSV file backed by Amazon S3.

## CSV format

A CSV is expected with the following headers, which are mapped to an event
message JSON object with the field names expected by ledger.

| CSV header                          | Mapped field in emitted event                        |
|:------------------------------------|:-----------------------------------------------------|
| transaction_id                      | resource_external_id                                 |
| parent_transaction_id               | parent_resource_external_id                          |
| transaction_type                    | resource_type                                        |
| event_date                          | timestamp                                            |
| event_name                          | event_type                                           |
| reproject_domain_object             | reproject_domain_object                              |
| *\<transaction detail field name\>* | event_details['*\<transaction detail field name\>*'] |
