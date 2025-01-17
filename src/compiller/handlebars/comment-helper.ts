import handlebars from 'handlebars';

interface CommentContext {
    comment?: string;
}

handlebars.registerHelper('comment', function (this: CommentContext) {
    if (this.comment) {
        return `// ${this.comment.replace(/\n/g, '\n// ')}`;
    }
});
