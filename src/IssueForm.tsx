import React, { SyntheticEvent } from 'react';
import { Form, Col, Input, Select, Button } from 'antd';
import { WrappedFormUtils } from 'antd/lib/form/Form';
import { FormattedMessage } from 'react-intl';
import debounce from 'lodash.debounce';
import * as api from './api';
import BugForm from './BugForm';
import FeatureForm from './FeatureForm';
import PreviewModal from './PreviewModal';
import ReproModal from './ReproModal';
import createPreview from './createPreview';

const styles: any = require('./IssueForm.less');
const FormItem = Form.Item;
const { Option } = Select;

export interface IssueFormProps {
  form: WrappedFormUtils;
};

export interface IssueFormState {
  versions: string[];
  similarIssues: any[];
  preview: boolean;
  reproModal: boolean;
};

class IssueForm extends React.Component<IssueFormProps, IssueFormState> {
  formRef: HTMLElement;

  constructor(props: IssueFormProps) {
    super(props);

    this.state = {
      versions: [],
      similarIssues: [],
      preview: false,
      reproModal: false,
    };

    this.handleTitleChange = debounce(this.handleTitleChange, 500);
  }

  componentDidMount() {
    this.fetchVerions('ant-design');
    this.formRef.addEventListener('click', (e: Event) => {
      if ((e.target as any).getAttribute('href') === '#modal') {
        e.preventDefault();
        this.setState({ reproModal: true });
      }
    });
  }

  fetchVerions(repo: string) {
    api.fetchVersions(repo)
       .then((versions: string[]) => this.setState({ versions }));
  }

  fetchIssues() {
    const { form } = this.props;
    const repo = form.getFieldValue('repo');
    const title = form.getFieldValue('title');
    if (title) {
      api.fetchIssues(repo, title)
        .then(issues => this.setState({ similarIssues: issues }));
    } else {
      this.setState({ similarIssues: [] });
    }
  }

  handleRepoChange = (repo: string) => {
    this.fetchVerions(repo);
  }

  handleTitleChange = () => {
    this.fetchIssues();
  }

  handlePreview = (e: SyntheticEvent<HTMLElement>) => {
    e.preventDefault();
    this.props.form.validateFieldsAndScroll((err: any, values: any) => {
      if (!err) {
        this.setState({ preview: true });
      }
    });
  }

  handleClosePreview = () => {
    this.setState({ preview: false });
  }

  handleCreate = () => {
    const { form } = this.props;
    const issueType = form.getFieldValue('type');
    const repo = form.getFieldValue('repo');
    const title = encodeURIComponent(form.getFieldValue('title')).replace(/%2B/gi, '+');
    const content = this.getContent(issueType);
    const withMarker = `${content}\n\n<!-- generated by ant-design-issue-helper. DO NOT REMOVE -->`;
    const body = encodeURIComponent(withMarker).replace(/%2B/gi, '+');
    const label = issueType === 'feature' ? '&labels=Feature%20Request' : ''
    window.open(`https://github.com/ant-design/${repo}/issues/new?title=${title}&body=${body}${label}`)
  }

  getContent(issueType: string) {
    return createPreview(issueType, this.props.form.getFieldsValue());
  }

  render() {
    const { form } = this.props;
    const { versions, similarIssues, preview, reproModal } = this.state;
    const { getFieldDecorator, getFieldValue } = form;
    const issueType = getFieldValue('type');
    const content = this.getContent(issueType);

    const similarIssuesList = (
      <FormItem>
        <h3>Similar Issues:</h3>
        <ul>
          {similarIssues.map(issue => (
            <li key={issue.id}>
              <a href={issue.html_url} target="_blank" rel="noreferer noopener">{issue.title}</a>
            </li>
          ))}
        </ul>
      </FormItem>
    );

    return (
      <div ref={node => (this.formRef = node)}>
        <Form layout="horizontal" onSubmit={this.handlePreview}>
          <PreviewModal
            visible={preview}
            content={content}
            onCancel={this.handleClosePreview}
            onCreate={this.handleCreate}
          />
          <ReproModal visible={reproModal} onCancel={() => this.setState({ reproModal: false })} />
          <FormItem>
             <Col span={11}>
                <FormItem
                  label={<FormattedMessage id="issue.repo" defaultMessage="I am opening an issue for" />}
                  help={<FormattedMessage id="issue.repoHelp" defaultMessage="Please make sure to file the issue at appropriate repo." />}
                >
                  {getFieldDecorator('repo', {
                    initialValue: 'ant-design',
                  })(
                    <Select onChange={this.handleRepoChange}>
                      <Option key="ant-design">antd</Option>
                      <Option key="ant-design-mobile">antd-mobile</Option>
                    </Select>
                  )}
                </FormItem>
             </Col>
             <Col span={12} offset={1}>
                <FormItem
                  label={<FormattedMessage id="issue.type" defaultMessage="This is a" />}
                >
                  {getFieldDecorator('type', {
                    initialValue: 'bug',
                  })(
                    <Select>
                      <Option key="bug">
                        <FormattedMessage id="issue.type.bug" defaultMessage="Bug Report" />
                      </Option>
                      <Option key="feature">>
                        <FormattedMessage id="issue.type.feature" defaultMessage="Feature Request" />
                      </Option>
                    </Select>
                  )}
                </FormItem>
             </Col>
          </FormItem>
          <FormItem
            label={<FormattedMessage id="issue.title" defaultMessage="Title" />}
          >
            {getFieldDecorator('title', {
              rules: [
                { required: true },
              ]
            })(
              <Input onChange={this.handleTitleChange}/>
            )}
          </FormItem>
          {similarIssues.length > 0 && similarIssuesList}
          {issueType !== 'feature' ? (
            <BugForm
              form={form}
              versions={versions}
              similarIssues={similarIssues}
            />
          ) : (
            <FeatureForm form={form} />
          )}
          <FormItem>
            <div className={styles.submitBtn}>
              <Button type="primary" size="large" htmlType="submit">Preview</Button>
            </div>
          </FormItem>
        </Form>
      </div>
    );
  }
}

export default Form.create()(IssueForm);
