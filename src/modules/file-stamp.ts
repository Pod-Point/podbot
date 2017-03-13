export default class FileStamp {

    /**
     * Create a date and time string for file names
     *
     * @return string
     * 
     */
    public dateTime(): string {
        const currentDate = new Date();
        return currentDate.getFullYear() + '-' +
               ('0' + (currentDate.getMonth() + 1)).slice(-2) + '-' +
               currentDate.getDate() + '--' +
               currentDate.getHours() + '-' +
               ('0' + currentDate.getMinutes()).slice(-2) + '-' +
               ('0' + currentDate.getSeconds()).slice(-2);
    }

}
