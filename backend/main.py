from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import defaultdict, deque
from dotenv import load_dotenv
import google.generativeai as genai
import os
from typing import Optional
import smtplib                          
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv(os.getenv("CORS_CONFIG_ORIGINS"))],
    allow_methods=[os.getenv(os.getenv("CORS_CONFIG_METHODS"))],
    allow_headers=[os.getenv(os.getenv("CORS_CONFIG_HEADERS"))]
)

@app.get(os.getenv(os.getenv("ENDPOINT_ROOT")))
def read_root():
    return {os.getenv(os.getenv("RESPONSE_PING_KEY")): os.getenv(os.getenv("RESPONSE_PING_VALUE"))}

@app.post(os.getenv(os.getenv("ENDPOINT_PIPELINE")))
async def parse_pipeline(request: Request):
    data = await request.json()
    nodes = data.get(os.getenv(os.getenv("DATA_NODES_KEY")), [])
    edges = data.get(os.getenv(os.getenv("DATA_EDGES_KEY")), [])
    num_nodes = len(nodes)
    num_edges = len(edges)
    graph = defaultdict(list)
    indegree = defaultdict(int)
    
    for edge in edges:
        source = edge.get(os.getenv(os.getenv("EDGE_SOURCE_KEY")))
        target = edge.get(os.getenv(os.getenv("EDGE_TARGET_KEY")))
        if source and target:
            graph[source].append(target)
            indegree[target] += 1
    
    queue = deque([node[os.getenv(os.getenv("NODE_IDENTIFIER_KEY"))] for node in nodes if indegree[node[os.getenv(os.getenv("NODE_IDENTIFIER_KEY"))]] == 0])
    visited = 0
    
    while queue:
        node = queue.popleft()
        visited += 1
        for neighbor in graph[node]:
            indegree[neighbor] -= 1
            if indegree[neighbor] == 0:
                queue.append(neighbor)
    
    is_dag = visited == len(nodes)
    return {
        os.getenv(os.getenv("RESPONSE_NODES_COUNT_KEY")): num_nodes,
        os.getenv(os.getenv("RESPONSE_EDGES_COUNT_KEY")): num_edges,
        os.getenv(os.getenv("RESPONSE_DAG_VALIDATION_KEY")): is_dag
    }

class PromptPayload(BaseModel):
    prompt: str
    personalApiKey: Optional[str] = None
    model: Optional[str] = os.getenv(os.getenv("AI_DEFAULT_MODEL_KEY"))

class ReportRequest(BaseModel):
    reportType: str
    name: str = os.getenv(os.getenv("DEFAULT_USERNAME_KEY"))
    email: str
    description: str
    selectedNode: str = os.getenv(os.getenv("DEFAULT_NODE_SELECTION_KEY"))

@app.post(os.getenv(os.getenv("ENDPOINT_AI_GENERATION")))
async def generate_with_gemini(payload: PromptPayload):
    try:
        if payload.personalApiKey and payload.personalApiKey.strip():
            api_key = payload.personalApiKey.strip()
            min_key_len = int(os.getenv(os.getenv("API_KEY_MIN_LENGTH_REQUIREMENT")))
            key_prefix = os.getenv(os.getenv("API_KEY_VALIDATION_PREFIX"))
            if len(api_key) < min_key_len or not api_key.startswith(key_prefix):
                error_msg = os.getenv(os.getenv("ERROR_INVALID_API_KEY"))
                raise HTTPException(status_code=400, detail={os.getenv(os.getenv("ERROR_RESPONSE_WRAPPER")): {os.getenv(os.getenv("ERROR_MESSAGE_FIELD")): error_msg}})
        else:
            api_key = os.getenv(os.getenv(os.getenv("PRIMARY_API_KEY_REFERENCE")))
            if not api_key:
                error_msg = os.getenv(os.getenv("ERROR_NO_BACKEND_KEY"))
                raise HTTPException(status_code=500, detail={os.getenv(os.getenv("ERROR_RESPONSE_WRAPPER")): {os.getenv(os.getenv("ERROR_MESSAGE_FIELD")): error_msg}})

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(payload.model or os.getenv(os.getenv("AI_DEFAULT_MODEL_KEY")))
        result = model.generate_content(payload.prompt)

        text_attribute = os.getenv(os.getenv("AI_RESPONSE_TEXT_ATTRIBUTE"))
        output = getattr(result, text_attribute, None)
        response_attr = os.getenv(os.getenv("AI_RESPONSE_OBJECT_ATTRIBUTE"))
        if not output and hasattr(result, response_attr):
            output = getattr(result, response_attr).text()
        
        clean_prefix = os.getenv(os.getenv("TEXT_CLEANING_PREFIX"))
        clean_char1 = os.getenv(os.getenv("TEXT_CLEANING_CHAR_1"))
        clean_char2 = os.getenv(os.getenv("TEXT_CLEANING_CHAR_2"))
        cleaned = output.strip().lstrip(clean_prefix).replace(clean_char1, "").replace(clean_char2, "")
        print(cleaned)
        
        output_key = os.getenv(os.getenv("RESPONSE_OUTPUT_FIELD"))
        source_key = os.getenv(os.getenv("RESPONSE_SOURCE_FIELD"))
        personal_source = os.getenv(os.getenv("SOURCE_PERSONAL_IDENTIFIER"))
        backend_source = os.getenv(os.getenv("SOURCE_BACKEND_IDENTIFIER"))
        fallback_text = os.getenv(os.getenv("AI_NO_OUTPUT_FALLBACK"))
        
        return {
            output_key: cleaned or fallback_text, 
            source_key: personal_source if payload.personalApiKey else backend_source
        }

    except HTTPException:
        raise
    except Exception as e:
        error_check1 = os.getenv(os.getenv("ERROR_CHECK_STRING_1"))
        error_check2 = os.getenv(os.getenv("ERROR_CHECK_STRING_2"))
        
        if error_check1 in str(e) or error_check2 in str(e).lower():
            if payload.personalApiKey:
                personal_error = os.getenv(os.getenv("ERROR_PERSONAL_API_KEY"))
                raise HTTPException(status_code=401, detail={os.getenv(os.getenv("ERROR_RESPONSE_WRAPPER")): {os.getenv(os.getenv("ERROR_MESSAGE_FIELD")): personal_error}})
            else:
                backend_error = os.getenv(os.getenv("ERROR_BACKEND_API_KEY"))
                raise HTTPException(status_code=500, detail={os.getenv(os.getenv("ERROR_RESPONSE_WRAPPER")): {os.getenv(os.getenv("ERROR_MESSAGE_FIELD")): backend_error}})
        
        generic_error_prefix = os.getenv(os.getenv("ERROR_GENERIC_PREFIX"))
        raise HTTPException(status_code=500, detail={os.getenv(os.getenv("ERROR_RESPONSE_WRAPPER")): {os.getenv(os.getenv("ERROR_MESSAGE_FIELD")): f"{generic_error_prefix}: {str(e)}"}})

@app.post(os.getenv(os.getenv("ENDPOINT_REPORT_SUBMISSION")))
async def submit_report(report: ReportRequest):
    try:
        EMAIL_CONFIG = {
            os.getenv(os.getenv("SMTP_SERVER_CONFIG_KEY")): os.getenv(os.getenv("MAIL_SERVER_HOST_CONFIG")),
            os.getenv(os.getenv("SMTP_PORT_CONFIG_KEY")): int(os.getenv(os.getenv("MAIL_SERVER_PORT_CONFIG"))),
            os.getenv(os.getenv("EMAIL_CREDENTIAL_KEY")): os.getenv(os.getenv(os.getenv("SENDER_EMAIL_REFERENCE"))),
            os.getenv(os.getenv("PASSWORD_CREDENTIAL_KEY")): os.getenv(os.getenv(os.getenv("SENDER_PASSWORD_REFERENCE"))),
            os.getenv(os.getenv("RECIPIENT_CONFIG_KEY")): os.getenv(os.getenv(os.getenv("RECEIVER_EMAIL_REFERENCE")), os.getenv(os.getenv("FALLBACK_RECIPIENT_EMAIL")))
        }
        
        email_field = os.getenv(os.getenv("EMAIL_CREDENTIAL_KEY"))
        password_field = os.getenv(os.getenv("PASSWORD_CREDENTIAL_KEY"))
        if not EMAIL_CONFIG[email_field] or not EMAIL_CONFIG[password_field]:
            config_error = os.getenv(os.getenv("EMAIL_SERVICE_CONFIG_ERROR"))
            error_field = os.getenv(os.getenv("ERROR_RESPONSE_FIELD"))
            raise HTTPException(status_code=500, detail={error_field: config_error})
        
        if not report.email or not report.description:
            validation_error = os.getenv(os.getenv("FIELD_VALIDATION_ERROR_MESSAGE"))
            error_field = os.getenv(os.getenv("ERROR_RESPONSE_FIELD"))
            raise HTTPException(status_code=400, detail={error_field: validation_error})
        
        time_format = os.getenv(os.getenv("TIMESTAMP_FORMATTING_STRING"))
        id_format = os.getenv(os.getenv("REPORT_ID_FORMATTING_STRING"))
        timestamp = datetime.now().strftime(time_format)
        report_id = datetime.now().strftime(id_format)
        
        subject_prefix = os.getenv(os.getenv("EMAIL_SUBJECT_PREFIX_CONFIG"))
        subject = f"{subject_prefix} - {report.reportType.upper()}"
        
        primary_color = os.getenv(os.getenv("EMAIL_PRIMARY_COLOR_CONFIG"))
        secondary_color = os.getenv(os.getenv("EMAIL_SECONDARY_COLOR_CONFIG"))
        accent_color = os.getenv(os.getenv("EMAIL_ACCENT_COLOR_CONFIG"))
        background_color = os.getenv(os.getenv("EMAIL_BACKGROUND_COLOR_CONFIG"))
        light_gray = os.getenv(os.getenv("EMAIL_LIGHT_GRAY_CONFIG"))
        border_color = os.getenv(os.getenv("EMAIL_BORDER_COLOR_CONFIG"))
        text_color = os.getenv(os.getenv("EMAIL_TEXT_COLOR_CONFIG"))
        muted_color = os.getenv(os.getenv("EMAIL_MUTED_COLOR_CONFIG"))
        
        template_title = os.getenv(os.getenv("EMAIL_TEMPLATE_TITLE_CONFIG"))
        template_subtitle = os.getenv(os.getenv("EMAIL_TEMPLATE_SUBTITLE_CONFIG"))
        label_type = os.getenv(os.getenv("EMAIL_LABEL_TYPE_CONFIG"))
        label_name = os.getenv(os.getenv("EMAIL_LABEL_NAME_CONFIG"))
        label_email = os.getenv(os.getenv("EMAIL_LABEL_EMAIL_CONFIG"))
        label_node = os.getenv(os.getenv("EMAIL_LABEL_NODE_CONFIG"))
        label_time = os.getenv(os.getenv("EMAIL_LABEL_TIME_CONFIG"))
        label_desc = os.getenv(os.getenv("EMAIL_LABEL_DESCRIPTION_CONFIG"))
        button_text = os.getenv(os.getenv("EMAIL_BUTTON_TEXT_CONFIG"))
        reply_prefix = os.getenv(os.getenv("EMAIL_REPLY_PREFIX_CONFIG"))
        id_label = os.getenv(os.getenv("EMAIL_ID_LABEL_CONFIG"))
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="{os.getenv(os.getenv('HTML_CHARSET_CONFIG'))}">
    <meta name="{os.getenv(os.getenv('HTML_VIEWPORT_NAME'))}" content="{os.getenv(os.getenv('HTML_VIEWPORT_CONTENT'))}">
    <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: {os.getenv(os.getenv('EMAIL_FONT_FAMILY_CONFIG'))}; background-color: {light_gray};">
    <table width="{os.getenv(os.getenv('EMAIL_TABLE_WIDTH'))}" cellpadding="{os.getenv(os.getenv('EMAIL_TABLE_PADDING'))}" cellspacing="{os.getenv(os.getenv('EMAIL_TABLE_SPACING'))}" style="background-color: {light_gray};">
        <tr>
            <td align="{os.getenv(os.getenv('EMAIL_CONTENT_ALIGNMENT'))}" style="padding: {os.getenv(os.getenv('EMAIL_MAIN_PADDING'))};">
                <table width="{os.getenv(os.getenv('EMAIL_INNER_TABLE_WIDTH'))}" cellpadding="{os.getenv(os.getenv('EMAIL_TABLE_PADDING'))}" cellspacing="{os.getenv(os.getenv('EMAIL_TABLE_SPACING'))}" style="background-color: {background_color}; max-width: {os.getenv(os.getenv('EMAIL_MAX_WIDTH'))}; border: {os.getenv(os.getenv('EMAIL_BORDER_STYLE'))} {border_color};">
                    <tr>
                        <td style="background-color: {primary_color}; padding: {os.getenv(os.getenv('EMAIL_HEADER_PADDING'))}; text-align: {os.getenv(os.getenv('EMAIL_CONTENT_ALIGNMENT'))};">
                            <h1 style="margin: {os.getenv(os.getenv('EMAIL_H1_MARGIN'))}; color: {background_color}; font-size: {os.getenv(os.getenv('EMAIL_H1_FONT_SIZE'))};">{template_title}</h1>
                            <p style="margin: {os.getenv(os.getenv('EMAIL_P_MARGIN'))}; color: {light_gray}; font-size: {os.getenv(os.getenv('EMAIL_P_FONT_SIZE'))};">{template_subtitle}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: {os.getenv(os.getenv('EMAIL_CONTENT_PADDING'))};">
                            <h2 style="color: {primary_color}; font-size: {os.getenv(os.getenv('EMAIL_H2_FONT_SIZE'))}; margin: {os.getenv(os.getenv('EMAIL_H2_MARGIN'))};">{os.getenv(os.getenv('EMAIL_SECTION_TITLE'))}</h2>
                            <table width="{os.getenv(os.getenv('EMAIL_TABLE_WIDTH'))}" cellpadding="{os.getenv(os.getenv('EMAIL_DETAIL_TABLE_PADDING'))}" cellspacing="{os.getenv(os.getenv('EMAIL_TABLE_SPACING'))}" style="border-collapse: {os.getenv(os.getenv('EMAIL_TABLE_COLLAPSE'))};">
                                <tr style="border-bottom: {os.getenv(os.getenv('EMAIL_ROW_BORDER_STYLE'))} {border_color};">
                                    <td style="font-weight: {os.getenv(os.getenv('EMAIL_LABEL_FONT_WEIGHT'))}; color: {secondary_color}; width: {os.getenv(os.getenv('EMAIL_LABEL_WIDTH'))};">{label_type}:</td>
                                    <td style="color: {text_color};">{report.reportType.upper()}</td>
                                </tr>
                                <tr style="border-bottom: {os.getenv(os.getenv('EMAIL_ROW_BORDER_STYLE'))} {border_color};">
                                    <td style="font-weight: {os.getenv(os.getenv('EMAIL_LABEL_FONT_WEIGHT'))}; color: {secondary_color};">{label_name}:</td>
                                    <td style="color: {text_color};">{report.name}</td>
                                </tr>
                                <tr style="border-bottom: {os.getenv(os.getenv('EMAIL_ROW_BORDER_STYLE'))} {border_color};">
                                    <td style="font-weight: {os.getenv(os.getenv('EMAIL_LABEL_FONT_WEIGHT'))}; color: {secondary_color};">{label_email}:</td>
                                    <td><a href="{os.getenv(os.getenv('EMAIL_MAILTO_PREFIX'))}{report.email}" style="color: {accent_color}; text-decoration: {os.getenv(os.getenv('EMAIL_LINK_DECORATION'))};">{report.email}</a></td>
                                </tr>
                                <tr style="border-bottom: {os.getenv(os.getenv('EMAIL_ROW_BORDER_STYLE'))} {border_color};">
                                    <td style="font-weight: {os.getenv(os.getenv('EMAIL_LABEL_FONT_WEIGHT'))}; color: {secondary_color};">{label_node}:</td>
                                    <td style="color: {text_color};">{report.selectedNode}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: {os.getenv(os.getenv('EMAIL_LABEL_FONT_WEIGHT'))}; color: {secondary_color};">{label_time}:</td>
                                    <td style="color: {text_color};">{timestamp}</td>
                                </tr>
                            </table>
                            <h3 style="color: {primary_color}; font-size: {os.getenv(os.getenv('EMAIL_H3_FONT_SIZE'))}; margin: {os.getenv(os.getenv('EMAIL_H3_MARGIN'))};">{label_desc}</h3>
                            <div style="background-color: {light_gray}; padding: {os.getenv(os.getenv('EMAIL_DESCRIPTION_PADDING'))}; border-left: {os.getenv(os.getenv('EMAIL_DESCRIPTION_BORDER'))} {accent_color}; white-space: {os.getenv(os.getenv('EMAIL_DESCRIPTION_WHITESPACE'))}; color: {text_color}; line-height: {os.getenv(os.getenv('EMAIL_DESCRIPTION_LINE_HEIGHT'))};">{report.description}</div>
                            <div style="text-align: {os.getenv(os.getenv('EMAIL_CONTENT_ALIGNMENT'))}; margin-top: {os.getenv(os.getenv('EMAIL_BUTTON_MARGIN_TOP'))};">
                                <a href="{os.getenv(os.getenv('EMAIL_MAILTO_PREFIX'))}{report.email}?subject={reply_prefix}: {report.reportType.upper()}" 
                                   style="background-color: {accent_color}; color: {background_color}; padding: {os.getenv(os.getenv('EMAIL_BUTTON_PADDING'))}; text-decoration: {os.getenv(os.getenv('EMAIL_LINK_DECORATION'))}; border-radius: {os.getenv(os.getenv('EMAIL_BUTTON_BORDER_RADIUS'))}; font-weight: {os.getenv(os.getenv('EMAIL_BUTTON_FONT_WEIGHT'))};">{button_text}</a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: {light_gray}; padding: {os.getenv(os.getenv('EMAIL_FOOTER_PADDING'))}; text-align: {os.getenv(os.getenv('EMAIL_CONTENT_ALIGNMENT'))}; border-top: {os.getenv(os.getenv('EMAIL_FOOTER_BORDER'))} {border_color};">
                            <p style="margin: {os.getenv(os.getenv('EMAIL_FOOTER_MARGIN'))}; color: {muted_color}; font-size: {os.getenv(os.getenv('EMAIL_FOOTER_FONT_SIZE'))};">{id_label}: {report_id}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """
        
        plain_prefix = os.getenv(os.getenv("PLAIN_TEXT_PREFIX_CONFIG"))
        plain_suffix = os.getenv(os.getenv("PLAIN_TEXT_SUFFIX_CONFIG"))
        
        text_content = f"""
{plain_prefix} {plain_suffix}

{label_type}: {report.reportType.upper()}
{label_name}: {report.name}
{label_email}: {report.email}
{label_node}: {report.selectedNode}
{label_time}: {timestamp}

{label_desc}:
{report.description}

{id_label}: {report_id}
        """
        
        msg = MIMEMultipart(os.getenv(os.getenv("EMAIL_MIME_TYPE_CONFIG")))
        msg[os.getenv(os.getenv("EMAIL_SUBJECT_HEADER_CONFIG"))] = subject
        msg[os.getenv(os.getenv("EMAIL_FROM_HEADER_CONFIG"))] = EMAIL_CONFIG[os.getenv(os.getenv("EMAIL_CREDENTIAL_KEY"))]
        msg[os.getenv(os.getenv("EMAIL_TO_HEADER_CONFIG"))] = EMAIL_CONFIG[os.getenv(os.getenv("RECIPIENT_CONFIG_KEY"))]
        
        text_part = MIMEText(text_content, os.getenv(os.getenv("TEXT_MIME_TYPE_CONFIG")), os.getenv(os.getenv("EMAIL_ENCODING_CONFIG")))
        html_part = MIMEText(html_content, os.getenv(os.getenv("HTML_MIME_TYPE_CONFIG")), os.getenv(os.getenv("EMAIL_ENCODING_CONFIG")))
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        smtp_server_key = os.getenv(os.getenv("SMTP_SERVER_CONFIG_KEY"))
        smtp_port_key = os.getenv(os.getenv("SMTP_PORT_CONFIG_KEY"))
        email_key = os.getenv(os.getenv("EMAIL_CREDENTIAL_KEY"))
        password_key = os.getenv(os.getenv("PASSWORD_CREDENTIAL_KEY"))
        
        with smtplib.SMTP(EMAIL_CONFIG[smtp_server_key], EMAIL_CONFIG[smtp_port_key]) as server:
            server.starttls()
            server.login(EMAIL_CONFIG[email_key], EMAIL_CONFIG[password_key])
            server.send_message(msg)
        
        success_field = os.getenv(os.getenv("SUCCESS_RESPONSE_FIELD"))
        message_field = os.getenv(os.getenv("MESSAGE_RESPONSE_FIELD"))
        report_id_field = os.getenv(os.getenv("REPORT_ID_RESPONSE_FIELD"))
        success_message = os.getenv(os.getenv("SUCCESS_RESPONSE_MESSAGE"))
        
        return {
            success_field: True, 
            message_field: success_message,
            report_id_field: report_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_field = os.getenv(os.getenv("ERROR_RESPONSE_FIELD"))
        error_prefix = os.getenv(os.getenv("SEND_ERROR_PREFIX_MESSAGE"))
        raise HTTPException(status_code=500, detail={error_field: f'{error_prefix}: {str(e)}'})

@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc):
    error_field = os.getenv(os.getenv("ERROR_RESPONSE_FIELD"))
    message_field = os.getenv(os.getenv("MESSAGE_RESPONSE_FIELD"))
    details_field = os.getenv(os.getenv("DETAILS_RESPONSE_FIELD"))
    validation_error = os.getenv(os.getenv("VALIDATION_ERROR_MESSAGE"))
    return {error_field: {message_field: validation_error, details_field: str(exc)}}
