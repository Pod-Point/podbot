import * as Config from 'config';
import DatabaseMigration from '../services/database-migration';
import S3Migration from '../services/s3-migration';

export default class Migrate {

    private env: string = (process.env.ENV === 'production') ? 'production' : 'testing';
    private s3migration: S3Migration = new S3Migration();
    private websiteStagingBucket: string = Config.get<string>('website.s3.' + this.env + '.staging');
    private websiteLiveBucket: string = Config.get<string>('website.s3.' + this.env + '.live');
    private dbMigration: DatabaseMigration = new DatabaseMigration();
    private websiteReplicationTask: string = Config.get<string>('website.dms.' + this.env + '.replication-task-arn');
    private replicationTaskChecker: any;

    /**
     * Register any message listeners
     *
     * @param  {BotController} controller
     * @return {void}
     */
    // tslint:disable-next-line:max-func-body-length
    public messageListeners(controller: BotController): void {

        controller.hears(['migrate website'], [
            'direct_message',
            'direct_mention',
            'mention'
        ], (bot, message) => {

            const attachments: SlackAttachment[] = [
                {
                    fallback: 'Migrate website content from staging to live',
                    title: 'Migrate website content from staging to live',
                    text: 'What would you like to migrate?',
                    callback_id: 'website',
                    attachment_type: 'default',
                    actions: [
                        {
                            name: 's3',
                            text: 'S3',
                            value: 's3',
                            type: 'button'
                        },
                        {
                            name: 'database',
                            text: 'Database',
                            value: 'database',
                            type: 'button'
                        },
                        {
                            name: 'both',
                            text: 'Both',
                            value: 'both',
                            type: 'button'
                        },
                        {
                            name: 'cancel',
                            text: 'Cancel',
                            value: 'cancel',
                            style: 'danger',
                            type: 'button'
                        }
                    ]
                }
            ];

            bot.reply(message, {attachments: attachments});

        });

    }

    /**
     * Register any message callbacks to be listened for
     *
     * @param  {SlackBot} bot
     * @param  {SlackMessage} message
     * @return {void}
     */
    public callbacks(bot: SlackBot, message: SlackMessage): void {

        const action: SlackAttachmentAction = message.actions[0];

        if (action.name === 'cancel') {
            return bot.api.chat.delete({
                token: bot.config.token,
                ts: message.message_ts,
                channel: message.channel
            });
        }

        if (message.callback_id === 'website') {
            const responses: { [index: string]: SlackAttachment; } = {};

            if (action.name === 's3' || action.name === 'both') {
                responses['s3'] = {
                        fallback: 'Migrating website S3 content from staging to live...',
                        color: '#3AA3E3',
                        title: 'Migrating website S3 content from staging to live...',
                        text: 'In progress...'
                };

                const migrateBucket = this.s3migration.migrateBucket(this.websiteStagingBucket, this.websiteLiveBucket);
                migrateBucket.then((val) => {
                    responses['s3'].text = 'Success!';
                    responses['s3'].color = 'good';
                    this.updateSlack(responses, bot, message);
                })
                .catch((err) => {
                    responses['s3'].text = 'Errors - please check log for details';
                    responses['s3'].color = 'danger';
                    this.updateSlack(responses, bot, message);
                });
            }

            if (action.name === 'database' || action.name === 'both') {
                responses['database'] = {
                        fallback: 'Migrating website database from staging to live...',
                        color: '#3AA3E3',
                        title: 'Migrating website database from staging to live...',
                        text: 'In progress...'
                };

                const migrateDatabase = this.dbMigration.migrateDatabase(this.websiteReplicationTask);
                migrateDatabase.then((val) => {
                    responses['database'].text = val;
                    this.updateSlack(responses, bot, message);
                    this.replicationTaskChecker = setInterval(() => {
                        this.checkReplicationTaskStatusTillDone(this.websiteReplicationTask, responses, bot, message);
                    }, 5000);
                })
                .catch((err) => {
                    responses['database'].text = err;
                    responses['database'].color = 'danger';
                    this.updateSlack(responses, bot, message);
                });
            }

            this.updateSlack(responses, bot, message);
        }
    }

    /**
     * Check replication task status until complete or error
     *
     * @param  {string}  replicationTask
     * @param  {Object}  responses
     * @param  {SlackBot} bot
     * @param  {SlackMessage} message
     * @return {void}
     */
    private checkReplicationTaskStatusTillDone(replicationTask: string, responses: { [index: string]: SlackAttachment; }, bot: SlackBot, message: SlackMessage) {

        const getReplicationTaskStatus = this.dbMigration.getReplicationTaskStatus(this.websiteReplicationTask);

        getReplicationTaskStatus.then((val) => {
            if (val === 'running') {
                responses['database'].text = 'Running...';
                this.updateSlack(responses, bot, message);
            }
            if (val === 'success') {
                clearInterval(this.replicationTaskChecker);
                responses['database'].text = 'Success!';
                responses['database'].color = 'good';
                this.updateSlack(responses, bot, message);
            }
        })

        .catch((err) => {
            clearInterval(this.replicationTaskChecker);
            responses['database'].text = 'Errors during migration. <https://eu-west-1.console.aws.amazon.com/dms/home?region=eu-west-1#tasks:|See here> for more details.';
            responses['database'].color = 'danger';
            this.updateSlack(responses, bot, message);
        });
    }

    /**
     * Update slack with AWS responses
     *
     * @param  {Object}  responses
     * @param  {SlackBot} bot
     * @param  {SlackMessage} message
     * @return {void}
     */
    private updateSlack(responses: { [index: string]: SlackAttachment; }, bot: SlackBot, message: SlackMessage): void {

        const attachments: SlackAttachment[] = [];

        Object.keys(responses).forEach((key) => {
            attachments.push(responses[key]);
        });

        bot.replyInteractive(message, {
            attachments: attachments
        });
    }

}
